export interface AuditLogInterface {
    record_id: string;
    user_id: string;
    action: string;
    field_name?: string;
    old_value?: string;
    new_value?: string;
}
