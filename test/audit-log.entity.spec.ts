import { AuditLog } from "../src/audit-logs/entities/audit-log.entity";

describe("AuditLog Entity", () => {
    it("should create audit log with action", () => {
        const log = new AuditLog();
        log.action = "Edit";
        log.record_id = "rec123";
        log.user_id = "user123";
        log.field_name = "loan_amount";
        log.old_value = "400000";
        log.new_value = "450000";
        expect(log.action).toBe("Edit");
        expect(log.new_value).toBe("450000");
    });
});
