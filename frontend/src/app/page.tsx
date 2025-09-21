'use client'

import { useState, useEffect } from 'react'
import detectEthereumProvider from '@metamask/detect-provider'
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers'
import { Vote, Plus, Users, Clock, Shield, CheckCircle, LogOut, Lock, Heart, ExternalLink, Trash2, Square } from 'lucide-react'
import SimpleConfidentialVoteArtifact from '../SimpleConfidentialVote.json'
import { createEncryptedVote } from '../lib/fhevm'

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, callback: (...args: unknown[]) => void) => void
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void
    }
  }
}

// Contract deployed address and network config
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x4355e5cf8b33020c389ec746e709C949f986146A'
const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/62ae9c75c5d94a0486c8c35a1a50b076'

interface Poll {
  id: number
  title: string
  options: string[]
  endTime: number
  creator: string
  isActive: boolean
  totalVoters: number
  hasVoted: boolean
  voteCounts?: number[]
  winner?: {
    winningOptions: number[]
    maxVotes: number
    hasTie: boolean
  }
}

export default function ZamaVault() {
  const [account, setAccount] = useState<string>('')
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [contract, setContract] = useState<Contract | null>(null)
  const [activePolls, setActivePolls] = useState<Poll[]>([])
  const [pastPolls, setPastPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(false)
  const [networkError, setNetworkError] = useState<string>('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPoll, setNewPoll] = useState({
    title: '',
    options: ['', ''],
    duration: 24
  })
  const [currentChainId, setCurrentChainId] = useState<string>('')
  const [userVotes, setUserVotes] = useState<{ [key: number]: number }>({})
  const [currentTime, setCurrentTime] = useState(Date.now())

  useEffect(() => {
    // Listen for network changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged)
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('chainChanged', handleChainChanged)
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged)        
        }
      }
    }
  }, [])

  useEffect(() => {
    // Load polls on component mount (even without wallet)
    loadPolls()
  }, [])

  useEffect(() => {
    // Update time every second for countdown
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (contract) {
      loadPolls()
    }
  }, [contract])

  const handleChainChanged = (...args: unknown[]) => {
    const chainId = args[0] as string
    setCurrentChainId(chainId)
    checkNetwork(chainId)
    // Reload the page to reset the state
    window.location.reload()
  }

  const handleAccountsChanged = (...args: unknown[]) => {
    const accounts = args[0] as string[]
    if (accounts.length === 0) {
      setAccount('')
      setContract(null)
    } else {
      setAccount(accounts[0])
      // Re-initialize contract with new account
      initializeEthers()
    }
  }

  const checkNetwork = (chainId: string) => {
    const expectedChainId = '0xaa36a7' // 11155111 in hex (Sepolia)
    if (chainId !== expectedChainId) {
      setNetworkError(`Wrong network! Please switch to Sepolia Testnet (Chain ID: 11155111)`)
    } else {
      setNetworkError('')
    }
  }

  const loadPolls = async () => {
    try {
      setLoading(true)
      
      // Use existing contract or create read-only provider
      let contractToUse = contract
      if (!contractToUse) {
        // Create read-only provider using public Sepolia RPC
        const readOnlyProvider = new JsonRpcProvider(SEPOLIA_RPC_URL)
        contractToUse = new Contract(CONTRACT_ADDRESS, SimpleConfidentialVoteArtifact.abi, readOnlyProvider)
      }
      
      const totalPolls = await contractToUse.getTotalPolls()
      const activePollsData: Poll[] = []
      const pastPollsData: Poll[] = []
      
      for (let i = 0; i < Number(totalPolls); i++) {
        const pollInfo = await contractToUse.getPollInfo(i)
        
        // Skip deleted polls (title is empty after deletion)
        if (!pollInfo[0] || pollInfo[0].trim() === '') {
          continue
        }
        
        const hasVoted = account && contractToUse === contract ? 
          await contractToUse.hasVotedInPoll(i, account) : false
        
        // Get vote counts for all polls
        let voteCounts: number[] = []
        try {
          for (let j = 0; j < pollInfo[1].length; j++) {
            const count = await contractToUse.getVoteCount(i, j)
            voteCounts.push(Number(count))
          }
        } catch (error) {
          console.log('Could not get vote counts for poll', i, error)
          // Fallback to zeros
          voteCounts = new Array(pollInfo[1].length).fill(0)
        }
        
        // Get winner info for ended polls with votes
        let winner = undefined
        if (!pollInfo[4] && Number(pollInfo[5]) > 0) { // Not active and has votes
          try {
            const winnerInfo = await contractToUse.getWinner(i)
            winner = {
              winningOptions: winnerInfo[0].map((n: unknown) => Number(n)),
              maxVotes: Number(winnerInfo[1]),
              hasTie: winnerInfo[2]
            }
          } catch (error) {
            console.log('Could not get winner for poll', i, error)
          }
        }
        
        const pollData = {
          id: i,
          title: pollInfo[0],
          options: pollInfo[1],
          endTime: Number(pollInfo[2]),
          creator: pollInfo[3],
          isActive: pollInfo[4],
          totalVoters: Number(pollInfo[5]),
          hasVoted,
          voteCounts,
          winner
        }
        
        // Separate active and past polls
        const now = Math.floor(Date.now() / 1000)
        const isCurrentlyActive = pollInfo[4] && pollData.endTime > now
        
        if (isCurrentlyActive) {
          activePollsData.push(pollData)
        } else {
          pastPollsData.push(pollData)
        }
      }
      
      setActivePolls(activePollsData.reverse()) // Show newest first
      setPastPolls(pastPollsData.reverse()) // Show newest first
    } catch (error) {
      console.error('Error loading polls:', error)
    } finally {
      setLoading(false)
    }
  }

  const addSepoliaNetwork = async () => {
    try {
      await window.ethereum?.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xaa36a7',
          chainName: 'Sepolia Test Network',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: [SEPOLIA_RPC_URL],
          blockExplorerUrls: ['https://sepolia.etherscan.io']
        }]
      })
    } catch (error) {
      console.error('Error adding Sepolia network:', error)
      throw error
    }
  }

  const switchToSepoliaNetwork = async () => {
    if (!provider) return
    
    try {
      await provider.send('wallet_switchEthereumChain', [{
        chainId: '0xaa36a7'
      }])
    } catch (error: unknown) {
      // If the network doesn't exist (error 4902) or unrecognized chain ID, add it first
      const err = error as { code?: number; message?: string }
      if (err.code === 4902 || err.message?.includes('Unrecognized chain ID')) {
        try {
          await addSepoliaNetwork()
          // After adding, try to switch again
          if (provider) {
            await provider.send('wallet_switchEthereumChain', [{
              chainId: '0xaa36a7'
            }])
          }
        } catch (addError) {
          console.error('Error adding/switching network:', addError)
          alert('Failed to add Sepolia network. Please add it manually in MetaMask.')
        }
      } else {
        console.error('Error switching network:', error)
        alert('Failed to switch to Sepolia network. Please switch manually in MetaMask.')
      }
    }
  }

  const initializeEthers = async () => {
    try {
      const ethereumProvider = await detectEthereumProvider()
      if (!ethereumProvider) {
        alert('Please install MetaMask!')
        return
      }

      const browserProvider = new BrowserProvider(window.ethereum!)
      setProvider(browserProvider)

      // Get current chain ID
      const network = await browserProvider.getNetwork()
      const chainId = '0x' + network.chainId.toString(16)
      setCurrentChainId(chainId)
      checkNetwork(chainId)

      // If not on Sepolia, switch to it
      if (chainId !== '0xaa36a7') {
        await switchToSepoliaNetwork()
        return // Will reload after network switch
      }

      const signer = await browserProvider.getSigner()
      const address = await signer.getAddress()
      setAccount(address)

      const contractInstance = new Contract(CONTRACT_ADDRESS, SimpleConfidentialVoteArtifact.abi, signer)
      setContract(contractInstance)
      
    } catch (error) {
      console.error('Error initializing ethers:', error)
    }
  }

  const connectWallet = async () => {
    try {
      await window.ethereum?.request({ method: 'eth_requestAccounts' })
      await initializeEthers()
    } catch (error) {
      console.error('Error connecting wallet:', error)
      alert('Failed to connect wallet. Please try again.')
    }
  }

  const disconnectWallet = () => {
    setAccount('')
    setProvider(null)
    setContract(null)
    setActivePolls([])
    setPastPolls([])
    setNetworkError('')
  }

  const createPoll = async () => {
    if (!contract || !newPoll.title.trim()) return
    
    // Check network before creating poll
    if (currentChainId !== '0xaa36a7') {
      alert('Please switch to Sepolia network first!')
      return
    }
    
    const validOptions = newPoll.options.filter(opt => opt.trim() !== '')
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options')
      return
    }

    try {
      setLoading(true)
      const tx = await contract.createPoll(
        newPoll.title.trim(),
        validOptions,
        newPoll.duration
      )
      
      console.log('Transaction sent, waiting for confirmation...')
      await tx.wait()
      
      alert('🎉 Poll created successfully!')
      setShowCreateForm(false)
      setNewPoll({ title: '', options: ['', ''], duration: 24 })
      await loadPolls()
    } catch (error) {
      console.error('Error creating poll:', error)
      alert('Failed to create poll. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const vote = async (pollId: number, optionIndex: number) => {
    if (!contract || !provider) return
    
    // Check network before voting
    if (currentChainId !== '0xaa36a7') {
      alert('Please switch to Sepolia network first!')
      return
    }

    try {
      setLoading(true)
      
      // Create encrypted vote using FHEVM
      const signer = await provider.getSigner()
      const voterAddress = await signer.getAddress()
      const voteValue = 1 // Each vote counts as 1
      
      const encryptedVote = await createEncryptedVote(
        provider,
        CONTRACT_ADDRESS,
        voterAddress,
        voteValue
      )
      
      console.log('Encrypted vote created:', encryptedVote)
      console.log(`Casting vote for poll ${pollId}, option ${optionIndex}`)
      console.log('Vote parameters:', {
        pollId,
        optionIndex,
        handle: encryptedVote.handles[0],
        proofLength: encryptedVote.inputProof.length
      })
      
      const tx = await contract.vote(
        pollId, 
        optionIndex, 
        encryptedVote.handles[0], 
        encryptedVote.inputProof
      )
      
      console.log('Transaction sent, waiting for confirmation...')
      await tx.wait()
      
      alert('🎉 Vote cast successfully!')
      
      // Store user's vote choice locally
      setUserVotes(prev => ({
        ...prev,
        [pollId]: optionIndex
      }))
      
      await loadPolls()
    } catch (error) {
      console.error('Error casting vote:', error)
      alert('Failed to cast vote. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addOption = () => {
    if (newPoll.options.length < 10) {
      setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })
    }
  }

  const removeOption = (index: number) => {
    if (newPoll.options.length > 2) {
      const newOptions = newPoll.options.filter((_, i) => i !== index)
      setNewPoll({ ...newPoll, options: newOptions })
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newPoll.options]
    newOptions[index] = value
    setNewPoll({ ...newPoll, options: newOptions })
  }

  const formatCountdown = (endTime: number) => {
    const now = Math.floor(currentTime / 1000)
    const timeLeft = endTime - now

    if (timeLeft <= 0) {
      return { text: 'Poll Ended', className: 'text-red-600' }
    }

    const days = Math.floor(timeLeft / (24 * 3600))
    const hours = Math.floor((timeLeft % (24 * 3600)) / 3600)
    const minutes = Math.floor((timeLeft % 3600) / 60)
    const seconds = timeLeft % 60

    if (days > 0) {
      return { text: `${days}d ${hours}h left`, className: 'text-blue-600' }
    } else if (hours > 0) {
      return { text: `${hours}h ${minutes}m left`, className: 'text-orange-600' }
    } else if (minutes > 0) {
      return { text: `${minutes}m ${seconds}s left`, className: 'text-red-600' }
    } else {
      return { text: `${seconds}s left`, className: 'text-red-600 font-bold animate-pulse' }
    }
  }

  const deletePoll = async (pollId: number) => {
    if (!contract || !account) return
    
    try {
      setLoading(true)
      const tx = await contract.deletePoll(pollId)
      await tx.wait()
      alert('Poll deleted successfully!')
      await loadPolls()
    } catch (error: unknown) {
      console.error('Error deleting poll:', error)
      const err = error as { code?: string }
      if (err.code === 'ACTION_REJECTED') {
        // User cancelled transaction - don't show error
        console.log('User cancelled delete poll transaction')
      } else {
        alert('Failed to delete poll. You may not have permission.')
      }
    } finally {
      setLoading(false)
    }
  }

  const endPoll = async (pollId: number) => {
    if (!contract || !account) return
    
    try {
      setLoading(true)
      const tx = await contract.endPoll(pollId)
      await tx.wait()
      alert('Poll ended successfully!')
      await loadPolls()
    } catch (error: unknown) {
      console.error('Error ending poll:', error)
      const err = error as { code?: string }
      if (err.code === 'ACTION_REJECTED') {
        console.log('User cancelled end poll transaction')
      } else {
        alert('Failed to end poll. You may not have permission.')
      }
    } finally {
      setLoading(false)
    }
  }

  const clearAllPolls = async () => {
    if (!contract || !account) return
    
    const confirmed = confirm('Are you sure you want to clear ALL polls? This action cannot be undone.')
    if (!confirmed) return
    
    try {
      setLoading(true)
      const tx = await contract.clearAllPolls()
      await tx.wait()
      alert('All polls cleared successfully!')
      await loadPolls()
    } catch (error: unknown) {
      console.error('Error clearing polls:', error)
      const err = error as { code?: string }
      if (err.code === 'ACTION_REJECTED') {
        console.log('User cancelled clear all polls transaction')
      } else {
        alert('Failed to clear polls. You may not have admin permission.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Check if user is admin or poll creator
  const isAdmin = account?.toLowerCase() === '0xac7539f65d98313ea4bAbef870F6Ae29107aD4ce'.toLowerCase()
  const isPollCreator = (poll: Poll) => poll.creator?.toLowerCase() === account?.toLowerCase()
  const canManagePoll = (poll: Poll) => isAdmin || isPollCreator(poll)

  const tipDeveloper = async () => {
    const developerAddress = '0xAc7539F65d98313ea4bAbef870F6Ae29107aD4ce'
    
    try {
      // Try to open wallet extension if available
      if (window.ethereum) {
        // Try to open send transaction in MetaMask/Rabby
        try {
          await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              to: developerAddress,
              // No value - let user choose amount
              data: '0x'
            }]
          })
          
          alert('Thank you for the tip! 🙏')
          return
        } catch (error: unknown) {
          const err = error as { code?: number }
          if (err.code === 4001) {
            // User cancelled - that's ok
            return
          }
          // If transaction fails, fall back to copy address
        }
      }
      
      // Fallback: Copy address to clipboard
      try {
        await navigator.clipboard.writeText(developerAddress)
        alert('💝 Developer address copied to clipboard!\n\n' + 
              'Address: ' + developerAddress + '\n\n' + 
              'You can now send any amount of ETH, USDC, or other tokens!')
      } catch {
        // Final fallback: Show address in prompt
        prompt('💝 Developer tip address (copy this):', developerAddress)
      }
      
    } catch (error) {
      console.error('Tip error:', error)
      // Show address as final fallback
      prompt('💝 Developer tip address (copy this):', developerAddress)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ZamaVault</h1>
                <p className="text-gray-600">Secure Confidential Voting Platform</p>
              </div>
            </div>
            
            {account ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={tipDeveloper}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                  title="Tip developer (opens wallet or copies address)"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Tip Dev
                </button>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Connected Wallet</p>
                  <p className="font-mono text-sm text-gray-900">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </p>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={tipDeveloper}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                  title="Tip developer (opens wallet or copies address)"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Tip Dev
                </button>
              <button
                onClick={connectWallet}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
              >
                <Shield className="w-5 h-5 mr-2" />
                Connect Wallet
              </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Network Status */}
        {account && (
          <div className="mb-6">
            {networkError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-red-100 p-2 rounded-lg mr-3">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800">Network Error</h3>
                      <p className="text-red-700">{networkError}</p>
                    </div>
                  </div>
                  <button
                    onClick={switchToSepoliaNetwork}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Switch Network
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">Connected to Sepolia</h3>
                    <p className="text-green-700">Ready to create and vote on polls</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Poll Section - Only for connected wallets */}
        {account && !networkError && (
            <div className="mb-8">
              {!showCreateForm ? (
                <div className="text-center">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    disabled={!!networkError}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center mx-auto"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Poll
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border shadow-sm p-6 max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Poll</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Poll Title</label>
                      <input
                        type="text"
                        value={newPoll.title}
                        onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                        placeholder="Enter your poll question..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Options</label>
                      <div className="space-y-3">
                        {newPoll.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {newPoll.options.length > 2 && (
                              <button
                                onClick={() => removeOption(index)}
                                className="text-red-600 hover:text-red-800 px-2 py-2"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {newPoll.options.length < 10 && (
                        <button
                          onClick={addOption}
                          className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          + Add Option
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Duration (hours)</label>
                      <select
                        value={newPoll.duration}
                        onChange={(e) => setNewPoll({ ...newPoll, duration: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={1}>1 hour</option>
                        <option value={6}>6 hours</option>
                        <option value={12}>12 hours</option>
                        <option value={24}>24 hours</option>
                        <option value={48}>48 hours</option>
                        <option value={168}>1 week</option>
                      </select>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={createPoll}
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                      >
                        {loading ? 'Creating...' : 'Create Poll'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false)
                          setNewPoll({ title: '', options: ['', ''], duration: 24 })
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
        )}

        {/* Polls List - Always visible */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Active Polls</h2>
                <div className="flex items-center space-x-3">
                  {isAdmin && (activePolls.length > 0 || pastPolls.length > 0) && (
                    <button
                      onClick={clearAllPolls}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </button>
                  )}
                {loading && (
                  <div className="flex items-center text-gray-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                    Loading...
                  </div>
                )}
                </div>
              </div>

              {activePolls.length === 0 && !loading ? (
                <div className="text-center py-12">
                  <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No polls yet</h3>
                  <p className="text-gray-500">Create the first poll to get started!</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {activePolls.map((poll) => (
                    <div key={poll.id} className="bg-white rounded-xl border shadow-sm p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{poll.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {poll.totalVoters} voters
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {poll.isActive && new Date(poll.endTime * 1000) > new Date() ? 
                                `Ends ${new Date(poll.endTime * 1000).toLocaleDateString()}` : 
                                'Ended'
                              }
                            </div>
                            <div className="flex items-center">
                              <Shield className="w-4 h-4 mr-1" />
                              {poll.isActive ? 'Active' : 'Closed'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {poll.isActive && new Date(poll.endTime * 1000) > new Date() ? (
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span className={`font-medium ${formatCountdown(poll.endTime).className}`}>
                                {formatCountdown(poll.endTime).text}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              <span className="font-medium">Poll Ended</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {poll.options.map((option, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-gray-900">{option}</span>
                              {poll.voteCounts && poll.voteCounts[index] > 0 && (
                                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                  {poll.voteCounts[index]} votes
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              {poll.isActive && new Date(poll.endTime * 1000) > new Date() && !poll.hasVoted ? (
                                <button
                                  onClick={!account ? connectWallet : () => vote(poll.id, index)}
                                  disabled={loading}
                                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                >
                                  Vote
                                </button>
                              ) : poll.hasVoted ? (
                                userVotes[poll.id] === index ? (
                                  <span className="text-green-600 font-bold flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Your Vote
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )
                              ) : (
                                <span className="text-gray-400">Closed</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {poll.hasVoted && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-800 text-sm">
                            ✓ Your vote has been cast and encrypted using FHEVM technology
                          </p>
                        </div>
                      )}

                      {/* Winner Display */}
                      {poll.winner && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center mb-2">
                            <CheckCircle className="w-5 h-5 text-yellow-600 mr-2" />
                            <h4 className="font-semibold text-yellow-800">
                              {poll.winner.hasTie ? '🤝 Tie Result' : '🏆 Winner'}
                            </h4>
                    </div>
                          <div className="space-y-1">
                            {poll.winner.winningOptions.map((optionIndex) => (
                              <p key={optionIndex} className="text-yellow-800 font-medium">
                                &quot;{poll.options[optionIndex]}&quot; - {poll.winner!.maxVotes} votes
                              </p>
                  ))}
                </div>
                          {poll.winner.hasTie && (
                            <p className="text-yellow-700 text-sm mt-2">
                              Multiple options tied with {poll.winner.maxVotes} votes each
                            </p>
              )}
            </div>
                      )}

                      {/* Admin/Creator Management Buttons */}
                      {account && canManagePoll(poll) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              {isAdmin && !isPollCreator(poll) && (
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                  Admin Access
                                </span>
                              )}
                              {isPollCreator(poll) && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                  Your Poll
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {poll.isActive && (
                                <button
                                  onClick={() => endPoll(poll.id)}
                                  disabled={loading}
                                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-3 py-1 rounded text-sm transition-colors duration-200 flex items-center"
                                >
                                  <Square className="w-3 h-3 mr-1" />
                                  End
                                </button>
                              )}
                              <button
                                onClick={() => deletePoll(poll.id)}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded text-sm transition-colors duration-200 flex items-center"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
        
        {/* Past Polls Section */}
        {pastPolls.length > 0 && (
          <div className="space-y-6 mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Past Polls</h2>
              <div className="text-sm text-gray-500">
                {pastPolls.length} finished poll{pastPolls.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="grid gap-6">
              {pastPolls.map((poll) => (
                <div key={poll.id} className="bg-gray-50 rounded-xl border shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{poll.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {poll.totalVoters} voters
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Ended {new Date(poll.endTime * 1000).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-1" />
                          Finished
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {poll.options.map((option, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-800">{option}</span>
                          {poll.voteCounts && (
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full font-medium">
                              {poll.voteCounts[index]} votes
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          {poll.hasVoted && userVotes[poll.id] === index ? (
                            <span className="text-green-600 font-bold flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Your Vote
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {poll.hasVoted && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm">
                        ✓ Your vote was cast and encrypted using FHEVM technology
                      </p>
                    </div>
                  )}

                  {/* Winner Display */}
                  {poll.winner && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="w-5 h-5 text-yellow-600 mr-2" />
                        <h4 className="font-semibold text-yellow-800">
                          {poll.winner.hasTie ? '🤝 Tie Result' : '🏆 Winner'}
                        </h4>
                      </div>
                      <div className="space-y-1">
                        {poll.winner.winningOptions.map((optionIndex) => (
                          <p key={optionIndex} className="text-yellow-800 font-medium">
                            &quot;{poll.options[optionIndex]}&quot; - {poll.winner!.maxVotes} votes
                          </p>
                        ))}
                      </div>
                      {poll.winner.hasTie && (
                        <p className="text-yellow-700 text-sm mt-2">
                          Multiple options tied with {poll.winner.maxVotes} votes each
                        </p>
                      )}
                    </div>
                  )}

                  {/* Admin Management Buttons for Past Polls - Only Admin Can Delete */}
                  {account && isAdmin && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                            Admin Access
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => deletePoll(poll.id)}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded text-sm transition-colors duration-200 flex items-center"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show Poll Creator Badge (but no actions) */}
                  {account && isPollCreator(poll) && !isAdmin && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Your Poll
                        </span>
                        <p className="text-xs text-gray-500 mt-2">Past polls cannot be modified</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-16 text-center border-t pt-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Lock className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">ZamaVault</span>
          </div>
          <p className="text-gray-600 mb-2">Built for Zama Developer Program</p>
          <p className="text-sm text-gray-500 mb-4">Powered by FHEVM - Fully Homomorphic Encryption Virtual Machine</p>
          
          {/* Developer Info */}
          <div className="flex items-center justify-center space-x-6 mb-4 text-sm text-gray-600">
            <a 
              href="https://x.com/ume07x" 
          target="_blank"
          rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors duration-200 flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              @ume07x
            </a>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Discord: ume06
            </span>
            <button
              onClick={tipDeveloper}
              className="hover:text-yellow-600 transition-colors duration-200 flex items-center"
              title="Tip developer (opens wallet or copies address)"
            >
              <Heart className="w-4 h-4 mr-1" />
              💝 Tip
            </button>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-sm">
            <a 
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View Contract on Etherscan
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}