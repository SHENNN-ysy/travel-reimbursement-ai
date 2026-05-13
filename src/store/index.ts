import { configureStore } from '@reduxjs/toolkit';
import uploadReducer from './slices/uploadSlice';
import fileReducer from './slices/fileSlice';
import reportReducer from './slices/reportSlice';
import reimbursementReducer from './slices/reimbursementSlice';
import projectReducer from './slices/projectSlice';
import settingsReducer from './slices/settingsSlice';
import agentReducer from './slices/agentSlice';

export const store = configureStore({
  reducer: {
    upload: uploadReducer,
    files: fileReducer,
    report: reportReducer,
    reimbursement: reimbursementReducer,
    project: projectReducer,
    settings: settingsReducer,
    agent: agentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['upload/addFile', 'reimbursement/addFileToProject', 'reimbursement/updateFileInProject'],
        ignoredPaths: ['upload.files', 'reimbursement.currentProject.files'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
