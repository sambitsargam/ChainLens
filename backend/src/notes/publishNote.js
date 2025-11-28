import { getDKG } from '../config/dkgClient.js';

/**
 * Community Notes Publisher
 * 
 * Publishes Community Notes as Knowledge Assets on the OriginTrail DKG.
 */

/**
 * Publish a Community Note to the DKG
 * 
 * Creates a Knowledge Asset on the OriginTrail Decentralized Knowledge Graph
 * containing the Community Note JSON-LD data.
 * 
 * @param {Object} note - Community Note with public and private graphs
 * @returns {Promise<Object>} Publication result with UAL
 */
export async function publishNoteToDKG(note) {
  try {
    const dkg = await getDKG();
    
    if (!dkg) {
      throw new Error('DKG client not available. Please start your DKG Edge Node.');
    }
    
    // Prepare content for DKG
    const content = {
      public: note.public,
      private: note.private || {},
    };
    
    console.log('Publishing Community Note to DKG...');
    console.log(`  Topic: ${note.public.about}`);
    console.log(`  Alignment Score: ${note.public['gw:alignmentScore']}`);
    console.log(`  Discrepancies: ${note.public['gw:discrepancies']?.length || 0}`);
    
    // Create Knowledge Asset
    // epochsNum: number of epochs to keep the asset (6 is approximately 1 year on testnet)
    const result = await dkg.asset.create(content, {
      epochsNum: 6,
    });
    
    console.log('✓ Community Note published successfully');
    console.log(`  UAL: ${result.UAL}`);
    
    return {
      success: true,
      ual: result.UAL,
      publicAssertionId: result.publicAssertionId,
      operation: result.operation,
    };
  } catch (error) {
    console.error('✗ Failed to publish Community Note to DKG:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('blockchain')) {
      throw new Error('DKG blockchain connection failed - check your blockchain configuration');
    }
    
    if (error.message.includes('insufficient')) {
      throw new Error('Insufficient tokens to publish to DKG');
    }
    
    throw new Error(`Failed to publish to DKG: ${error.message}`);
  }
}

/**
 * Get a Knowledge Asset from DKG by UAL
 * 
 * @param {string} ual - Universal Asset Locator
 * @returns {Promise<Object>} Knowledge Asset data
 */
export async function getAssetByUAL(ual) {
  try {
    const dkg = await getDKG();
    
    console.log(`Fetching asset from DKG: ${ual}`);
    
    const result = await dkg.asset.get(ual);
    
    return {
      success: true,
      ual,
      assertion: result.assertion,
      public: result.assertion?.public || result.public,
      private: result.assertion?.private || result.private,
    };
  } catch (error) {
    console.error(`Error fetching asset ${ual}:`, error.message);
    throw new Error(`Failed to get asset from DKG: ${error.message}`);
  }
}

export default {
  publishNoteToDKG,
  getAssetByUAL,
};
