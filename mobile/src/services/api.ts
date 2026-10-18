import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TokenResponse,
  User,
  AssessmentCreate,
  AssessmentResponse,
  AssessmentHistoryItem,
  DashboardSummary,
} from "../types";

// The computer's Wi-Fi IP address on the local network
export const DEFAULT_API_URL = "http://192.168.0.105:8000/api/v1";

let activeBaseUrl = DEFAULT_API_URL;

export async function setApiBaseUrl(url: string) {
  activeBaseUrl = url;
  await AsyncStorage.setItem("custom_api_url", url);
}

export async function getApiBaseUrl(): Promise<string> {
  const saved = await AsyncStorage.getItem("custom_api_url");
  if (saved) {
    activeBaseUrl = saved;
  }
  return activeBaseUrl;
}

class MobileApiClient {
  private async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("auth_token");
    } catch {
      return null;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const url = await getApiBaseUrl();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${url}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMsg = `Server Error (${response.status})`;
        try {
          const errData = await response.json();
          if (typeof errData.detail === "string") {
            errorMsg = errData.detail;
          } else if (Array.isArray(errData.detail)) {
            errorMsg = errData.detail.map((e: any) => e.msg).join(", ");
          }
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (e: any) {
      if (e.message && e.message.includes("Network request failed")) {
        throw new Error("Unable to connect to backend server. Please verify backend is running on port 8000.");
      }
      throw e;
    }
  }

  async login(credentials: { email: string; password: string }): Promise<TokenResponse> {
    const res = await this.request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    await AsyncStorage.setItem("auth_token", res.access_token);
    return res;
  }

  async register(data: { email: string; password: string; full_name: string }): Promise<TokenResponse> {
    const res = await this.request<TokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    await AsyncStorage.setItem("auth_token", res.access_token);
    return res;
  }

  async getProfile(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  async createAssessment(assessment: AssessmentCreate): Promise<AssessmentResponse> {
    return this.request<AssessmentResponse>("/assessments/", {
      method: "POST",
      body: JSON.stringify(assessment),
    });
  }

  async getAssessmentHistory(): Promise<{ items: AssessmentHistoryItem[]; total: number }> {
    return this.request<{ items: AssessmentHistoryItem[]; total: number }>("/assessments/history?page=1&page_size=20");
  }

  async getAssessmentDetail(id: number): Promise<AssessmentResponse> {
    return this.request<AssessmentResponse>(`/assessments/${id}`);
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>("/dashboard/summary");
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("auth_user");
  }
}

export const mobileApi = new MobileApiClient();
