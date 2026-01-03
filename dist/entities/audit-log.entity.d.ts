export declare enum AuditAction {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    VIEW = "view",
    EXPORT = "export"
}
export declare enum AuditEntity {
    USER = "user",
    MEMBER = "member",
    POSITION = "position",
    CONTRIBUTION = "contribution",
    CONTRIBUTION_RULE = "contribution_rule",
    FILE = "file",
    HUBRET = "hubret",
    FAMILY = "family"
}
export declare class AuditLog {
    id: string;
    userId: string;
    username: string;
    action: AuditAction;
    entity: AuditEntity;
    entityId: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
    notes?: string;
    createdAt: Date;
}
