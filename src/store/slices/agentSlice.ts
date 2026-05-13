import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as api from '@/api';
import type {
  AgentSessionVO,
  AgentChatItem,
} from '@/types';

interface AgentState {
  // 会话列表
  sessions: AgentSessionVO[];
  sessionsLoading: boolean;

  // 当前会话
  currentSessionId: string | null;
  sessionDetailLoading: boolean;

  // 对话消息列表（渲染用）
  chatItems: AgentChatItem[];
  chatLoading: boolean;

  // 当前项目 ID
  projectId: number | null;
}

const initialState: AgentState = {
  sessions: [],
  sessionsLoading: false,
  currentSessionId: null,
  sessionDetailLoading: false,
  chatItems: [],
  chatLoading: false,
  projectId: null,
};

// ==================== Async Thunks ====================

/**
 * 获取会话列表
 */
export const fetchAgentSessions = createAsyncThunk(
  'agent/fetchSessions',
  async (projectId: number) => {
    return await api.getAgentSessions(projectId);
  }
);

/**
 * 获取会话详情（某sessionId下所有用户对话，按时间正序）
 */
export const fetchAgentSessionDetail = createAsyncThunk(
  'agent/fetchSessionDetail',
  async (sessionId: string) => {
    return await api.getAgentSessionDetail(sessionId);
  }
);

/**
 * 删除会话
 */
export const deleteAgentSession = createAsyncThunk(
  'agent/deleteSession',
  async (sessionId: string) => {
    await api.deleteAgentSession(sessionId);
    return sessionId;
  }
);

/**
 * 新建会话（后端创建占位记录，返回 sessionId）
 */
export const createAgentSession = createAsyncThunk(
  'agent/createSession',
  async (projectId: number) => {
    return await api.createAgentSession(projectId);
  }
);

// ==================== Slice ====================

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    setProjectId: (state, action: PayloadAction<number>) => {
      state.projectId = action.payload;
    },

    setCurrentSessionId: (state, action: PayloadAction<string | null>) => {
      state.currentSessionId = action.payload;
      if (action.payload === null) {
        state.chatItems = [];
      }
    },

    /** 清空对话 */
    clearChatItems: (state) => {
      state.chatItems = [];
    },

    /** 添加用户消息到列表 */
    addUserMessage: (state, action: PayloadAction<{ content: string }>) => {
      state.chatItems.push({
        id: `user-${Date.now()}`,
        role: 'user',
        content: action.payload.content,
        timestamp: new Date().toISOString(),
      });
    },

    /** 添加 AI 思考中状态 */
    addThinkingMessage: (state, action: PayloadAction<{ content: string }>) => {
      state.chatItems.push({
        id: `thinking-${Date.now()}`,
        role: 'assistant',
        content: action.payload.content,
        isThinking: true,
        timestamp: new Date().toISOString(),
      });
    },

    /** 更新最后一条 thinking 消息的内容 */
    updateLastThinkingMessage: (state, action: PayloadAction<string>) => {
      const last = state.chatItems[state.chatItems.length - 1];
      if (last && last.isThinking) {
        last.content = action.payload;
      }
    },

    // Don't remove reasoning/thinking on thinking end — keep them visible

    /** 添加模型推理中状态 */
    addReasoningMessage: (state, action: PayloadAction<{ content: string }>) => {
      state.chatItems.push({
        id: `reasoning-${Date.now()}`,
        role: 'assistant',
        content: action.payload.content,
        isReasoning: true,
        timestamp: new Date().toISOString(),
      });
    },

    /** 更新最后一条 reasoning 消息的内容（追加） */
    appendReasoningContent: (state, action: PayloadAction<string>) => {
      const last = state.chatItems[state.chatItems.length - 1];
      if (last && last.isReasoning) {
        last.content += action.payload;
      }
    },

    /** 删除所有 reasoning 消息（可能有多条） */
    removeLastReasoningMessage: (state) => {
      state.chatItems = state.chatItems.filter((item) => !item.isReasoning);
    },

    /** 添加工具调用记录（若已存在同工具调用则更新 input，不重复创建） */
    addToolCallItem: (
      state,
      action: PayloadAction<{ tool: string; input: Record<string, unknown>; isExecuting?: boolean }>
    ) => {
      const last = state.chatItems[state.chatItems.length - 1];
      if (last && last.toolCall && last.toolCall.tool === action.payload.tool) {
        // 同工具的多次调用事件（参数逐步到达），只更新 input，保留原 id
        last.toolCall.input = action.payload.input;
        last.toolResult = undefined;
        return;
      }
      state.chatItems.push({
        id: `tool-call-${Date.now()}`,
        role: 'assistant',
        content: `调用工具 ${action.payload.tool}`,
        toolCall: {
          tool: action.payload.tool,
          input: action.payload.input,
        },
        toolResult: action.payload.isExecuting === false
          ? { success: true, output: undefined }
          : undefined,
        timestamp: new Date().toISOString(),
      });
    },

    /** 更新最后一条工具调用记录的结果（显示在气泡中） */
    updateLastToolCallResult: (
      state,
      action: PayloadAction<{ success: boolean; output?: unknown; error?: string; isExecuting?: boolean }>
    ) => {
      const last = state.chatItems[state.chatItems.length - 1];
      if (last && last.toolCall) {
        if (action.payload.isExecuting === false) {
          // 执行完成，隐藏"执行中"，显示结果
          last.toolResult = {
            success: action.payload.success,
            output: action.payload.output,
            error: action.payload.error,
          };
        }
      }
    },

    /** 添加 AI 回复消息（支持自定义 ID，用于流式场景） */
    addAssistantMessage: (
      state,
      action: PayloadAction<{ id?: string; content: string }>
    ) => {
      // Don't remove reasoning/thinking — keep them visible after thinking ends
      state.chatItems.push({
        id: action.payload.id ?? `assistant-${Date.now()}`,
        role: 'assistant',
        content: action.payload.content,
        timestamp: new Date().toISOString(),
      });
    },

    /** 更新最后一条 assistant 消息的内容（传入完整累积内容，不是增量） */
    updateAssistantMessageContent: (state, action: PayloadAction<string>) => {
      const last = state.chatItems[state.chatItems.length - 1];
      if (last && last.role === 'assistant' && !last.toolCall && !last.isThinking) {
        last.content = action.payload;
      }
    },

    setChatLoading: (state, action: PayloadAction<boolean>) => {
      state.chatLoading = action.payload;
    },

    resetAgentState: () => initialState,
  },

  extraReducers: (builder) => {
    // fetchAgentSessions
    builder.addCase(fetchAgentSessions.pending, (state) => {
      state.sessionsLoading = true;
    });
    builder.addCase(fetchAgentSessions.fulfilled, (state, action) => {
      state.sessionsLoading = false;
      state.sessions = action.payload;
    });
    builder.addCase(fetchAgentSessions.rejected, (state) => {
      state.sessionsLoading = false;
    });

    // fetchAgentSessionDetail
    builder.addCase(fetchAgentSessionDetail.pending, (state) => {
      state.sessionDetailLoading = true;
    }),
    builder.addCase(fetchAgentSessionDetail.fulfilled, (state, action) => {
      state.sessionDetailLoading = false;
      // 追加历史消息，不要覆盖用户正在输入的消息
      // 后端按 id 升序返回，即时间正序
      const existingUserIds = new Set(
        state.chatItems
          .filter((item) => item.role === 'user')
          .map((item) => item.id)
      );
      const historyMessages = action.payload
        .filter((msg) => !existingUserIds.has(`history-user-${msg.id}`))
        .map((msg, idx) => ({
          id: `history-${msg.id}`,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: msg.timestamp,
        }));
      // 只有当历史消息与当前消息不重复时才追加
      const existingIds = new Set(state.chatItems.map((item) => item.id));
      const newHistory = historyMessages.filter((msg) => !existingIds.has(msg.id));
      if (newHistory.length > 0) {
        state.chatItems.push(...newHistory);
      }
    }),

    // deleteAgentSession
    builder.addCase(deleteAgentSession.fulfilled, (state, action) => {
      state.sessions = state.sessions.filter(
        (s) => s.sessionId !== action.payload
      );
      if (state.currentSessionId === action.payload) {
        state.currentSessionId = null;
        state.chatItems = [];
      }
    }),

    // createAgentSession
    builder.addCase(createAgentSession.fulfilled, (state, action) => {
      state.currentSessionId = action.payload;
      state.chatItems = [];
    });
  },
});

export const {
  setProjectId,
  setCurrentSessionId,
  clearChatItems,
  addUserMessage,
  addThinkingMessage,
  updateLastThinkingMessage,
  addReasoningMessage,
  appendReasoningContent,
  removeLastReasoningMessage,
  addToolCallItem,
  updateLastToolCallResult,
  addAssistantMessage,
  updateAssistantMessageContent,
  setChatLoading,
  resetAgentState,
} = agentSlice.actions;

export default agentSlice.reducer;
