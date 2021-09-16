import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserOvenStats, OvenSerializable } from '../../interfaces';

interface OvenSliceState {
  oven: OvenSerializable | null;
  showActions: boolean;
  userOvenData: UserOvenStats;
}

const initialState: OvenSliceState = {
  oven: null,
  showActions: false,
  userOvenData: { xtz: 0, ctez: 0, totalOvens: 0 },
};

export const OvenSlice = createSlice({
  name: 'oven',
  initialState,
  reducers: {
    toggleActions: (state, action: PayloadAction<boolean>) => {
      state.showActions = action.payload;
    },
    setOven: (state, action: PayloadAction<OvenSerializable>) => {
      state.oven = action.payload;
    },
    clearOven: (state) => {
      state.oven = null;
      state.showActions = false;
    },
    setUserOvenData: (state, action: PayloadAction<UserOvenStats>) => {
      state.userOvenData = action.payload;
    },
  },
});
