import { NetworkType } from '../interfaces';

// Vite exposes env via import.meta.env (VITE_-prefixed). Mainnet ctez v1
// values are baked as fallbacks so the app works even without a .env file.
const env = import.meta.env;

export const APP_NAME = env.VITE_APP_NAME || 'ctez';
export const NETWORK = (env.VITE_NETWORK_TYPE || 'mainnet') as NetworkType;
export const CFMM_ADDRESS = env.VITE_CFMM_CONTRACT || 'KT1H5b7LxEExkFd2Tng77TfuWbM5aPvHstPr';
export const CTEZ_ADDRESS = env.VITE_CTEZ_CONTRACT || 'KT1GWnsoFZVHGh7roXEER3qeCcgJgrXT3de2';
export const CTEZ_FA12_ADDRESS =
  env.VITE_CTEZ_FA12_CONTRACT || 'KT1SjXiUX63QvdNMcM2m492f7kuf8JxXRLp4';
export const LQT_FA12_ADDRESS = env.VITE_LQT_FA12_CONTRACT || 'KT1MX69KiYtZKNFeKfELyXJrWFhsQGgcuNgh';
export const RPC_URL = env.VITE_RPC_URL || 'https://rpc.tzkt.io/mainnet';
export const TZKT_API = env.VITE_TZKT_API || 'https://api.mainnet.tzkt.io';
export const TZKT_PORT = env.VITE_TZKT_PORT || '443';
export const CONTRACT_DEPLOYMENT_DATE = env.VITE_CONTRACT_DEPLOYMENT_DATE || '2021-10-20';
export const CTEZ_CONTRACT_BIGMAP = Number(env.VITE_CTEZ_CONTRACT_BIGMAP ?? 20919);
export const TOTAL_OVEN_IMAGES = 11;
export const DEFAULT_SLIPPAGE = 0.5;
export const DEFAULT_DEADLINE = 20;
