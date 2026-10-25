import {
    DeepPartial,
    HasCustomFields,
    VendureEntity
} from '@vendure/core';
import { Column, Entity } from 'typeorm';

export class OneTimeCodeCustomFields {}

@Entity()
export class OneTimeCode extends VendureEntity implements HasCustomFields {
    constructor(input?: DeepPartial<OneTimeCode>) {
        super(input);
    }

    @Column()
    email: string;

    @Column()
    code: string;

    @Column()
    expiresAt: Date;

    @Column({ default: false })
    isUsed: boolean;

    @Column(type => OneTimeCodeCustomFields)
    customFields: OneTimeCodeCustomFields;
}
