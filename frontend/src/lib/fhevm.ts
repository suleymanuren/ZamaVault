import { BrowserProvider } from 'ethers'

// Create encrypted input for voting on Sepolia
export const createEncryptedVote = async (
  provider: BrowserProvider,
  contractAddress: string,
  voterAddress: string,
  voteValue: number
) => {
  try {
    console.log('Creating encrypted vote with FHEVM simulation...')
    console.log(`Contract: ${contractAddress}`)
    console.log(`Voter: ${voterAddress}`)
    console.log(`Vote Value: ${voteValue}`)
    
    // For Sepolia testnet with FHEVM support, we create a proper encrypted input
    // This simulates the FHEVM encryption process
    
    // Generate a deterministic but unique encrypted value based on inputs
    const timestamp = Date.now()
    // Generate deterministic encrypted values
    
    // Create encrypted handle (in real FHEVM this would be actual encrypted value)
    const encryptedHandle = '0x' + 
      Array.from({ length: 64 }, (_, i) => 
        ((timestamp + voteValue + i) % 16).toString(16)
      ).join('')
    
    // Create proof (in real FHEVM this would be cryptographic proof)
    const proof = '0x' + 
      Array.from({ length: 128 }, (_, i) => 
        ((timestamp + voterAddress.charCodeAt(i % voterAddress.length) + i) % 16).toString(16)
      ).join('')
    
    const encryptedInput = {
      handles: [encryptedHandle],
      inputProof: proof
    }
    
    console.log('Encrypted input created:', {
      handle: encryptedHandle.substring(0, 10) + '...',
      proof: proof.substring(0, 10) + '...'
    })
    
    // Simulate network delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return encryptedInput
  } catch (error) {
    console.error('Error creating encrypted vote:', error)
    throw new Error('Failed to create encrypted vote. Please try again.')
  }
}

// Utility function to validate encrypted input format
export const isValidEncryptedInput = (input: unknown): boolean => {
  const typedInput = input as { handles?: unknown[]; inputProof?: string }
  return !!(
    input &&
    typedInput.handles &&
    Array.isArray(typedInput.handles) &&
    typedInput.handles.length > 0 &&
    typedInput.inputProof &&
    typeof typedInput.inputProof === 'string' &&
    typedInput.inputProof.startsWith('0x')
  )
}
