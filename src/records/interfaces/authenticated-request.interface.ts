export interface AuthenticatedRequest extends Request {
    user: { id: string; [key: string]: any };
}
