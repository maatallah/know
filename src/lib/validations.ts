import { z } from 'zod';

// ============================================
// Knowledge Item
// ============================================

export const createKnowledgeSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    shortDescription: z.string().max(500).optional().nullable(),
    type: z.enum([
        'MACHINE_PROCEDURE',
        'WORK_INSTRUCTION',
        'MAINTENANCE_GUIDE',
        'TROUBLESHOOTING',
        'SAFETY_INSTRUCTION',
        'TRAINING_GUIDE',
    ]),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    criticalityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    estimatedTimeMin: z.number().int().positive().optional().nullable(),
    requiredTools: z.string().max(500).optional().nullable(),
    preconditions: z.string().max(1000).optional().nullable(),
    expectedOutcome: z.string().max(1000).optional().nullable(),
    departmentId: z.string().min(1, 'Department is required'),
    machineId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    effectiveDate: z.string().datetime().optional().nullable(),
    expiryDate: z.string().datetime().optional().nullable(),
    tagIds: z.array(z.string()).optional(),
    content: z.string().min(1, 'Content is required'),
});

export const updateKnowledgeSchema = createKnowledgeSchema.partial().extend({
    content: z.string().optional(),
});

// ============================================
// Workflow
// ============================================

export const workflowActionSchema = z.object({
    action: z.enum(['submit-review', 'approve', 'archive']),
    comment: z.string().max(1000).optional(),
}).refine(
    (data) => {
        if (data.action === 'approve' && (!data.comment || !data.comment.trim())) {
            return false;
        }
        return true;
    },
    { message: 'Approval comment is mandatory', path: ['comment'] }
);

// ============================================
// Knowledge Gap Request
// ============================================

export const createGapRequestSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(10).max(2000),
});

export const updateGapStatusSchema = z.object({
    status: z.enum(['OPEN', 'ASSIGNED', 'CLOSED']),
    assigneeId: z.string().optional().nullable(),
    linkedItemId: z.string().optional().nullable(),
});

// ============================================
// Auth / Login
// ============================================

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ============================================
// Helper: parse and return errors
// ============================================

export function validateRequest<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, errors: result.error };
}
