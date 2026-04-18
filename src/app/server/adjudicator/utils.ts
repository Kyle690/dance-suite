import * as crypto from "node:crypto";

export const createMarksChecksum=(params: {
    heat_id: string;
    adjudicator_id: string;
    marks: Array<{ dancer_id: string; dancer_number: number; dance: string }>;
    signature: string;
    ip_address: string;
    timestamp: Date;
}): string =>{
    // Sort marks for deterministic ordering
    const sortedMarks = [ ...params.marks ].sort((a, b) => {
        if (a.dancer_id !== b.dancer_id) return a.dancer_id.localeCompare(b.dancer_id);
        return a.dance.localeCompare(b.dance);
    });

    const canonical = JSON.stringify({
        heat_id: params.heat_id,
        adjudicator_id: params.adjudicator_id,
        marks: sortedMarks.map(m => ({
            dancer_id: m.dancer_id,
            dancer_number: m.dancer_number,
            dance: m.dance
        })),
        signature: params.signature,
        ip: params.ip_address,
        ts: params.timestamp.toISOString()
    });

    // Use HMAC for additional security
    const secret = process.env.MARKS_CHECKSUM_SECRET || 'dance-suite-marks-secret';
    return crypto.createHmac('sha256', secret).update(canonical).digest('hex');
}

export const verifyMarksChecksum = (params: {
    heat_id: string;
    adjudicator_id: string;
    marks: Array<{ dancer_id: string; dancer_number: number; dance: string }>;
    signature: string;
    ip_address: string;
    timestamp: Date;
    stored_checksum: string;
}): boolean => {
    const expected = createMarksChecksum({
        heat_id: params.heat_id,
        adjudicator_id: params.adjudicator_id,
        marks: params.marks,
        signature: params.signature,
        ip_address: params.ip_address,
        timestamp: params.timestamp,
    });
    return crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(params.stored_checksum, 'hex')
    );
}
