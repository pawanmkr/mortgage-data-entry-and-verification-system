import { VA_ACTION } from "../enums/va-action.enum";

export interface AuditLogInterface {
    record_id: string;
    user_id: string;
    action: VA_ACTION;
    field_name?: string;
    old_value?: string;
    new_value?: string;
}
