import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { RecordsService } from "src/records/records.service";
import { Record } from "src/records/entities/record.entity";
import { UsersService } from "src/users/users.service";

@Injectable()
export class TaskService {
    private readonly logger = new Logger(TaskService.name);
    private readonly RECORD_UNLOCK_DURATION: number;
    private readonly MAX_TIMEOUTS: number;
    private timeoutMap;
    private records: Record[];

    constructor(
        private readonly recordService: RecordsService,
        private readonly userSerice: UsersService
    ) {
        this.records = [];
        this.timeoutMap = new Map<string, NodeJS.Timeout>();
        this.RECORD_UNLOCK_DURATION = 10 * 60 * 1000; // 10 mins
        this.MAX_TIMEOUTS = 100;
    }

    // continue from here: in every 10 min window - if there are large number of locked rows
    // how you gonna handle that ? because let's say processing even 1000 or 10,000s of rows
    // in small time window with weak machine can degrade application performance, by consuming so much memory
    // which can otherwise be utilized to handle more traffic until when timeouts are not processed.
    // there can be memory leaks also - research about this
    // think: how can it be handled in efficient manner without using 3rd party libs or more tools

    @Cron(CronExpression.EVERY_10_MINUTES)
    async handleCron() {
        const lockedRecords = await this.recordService.getLockedRecords();

        this.logger.log(`Locked records found: ${lockedRecords.length}`);

        this.records.forEach((r) => {
            const now = new Date();
            const lockTime = new Date(r.lock_timestamp!);
            const elapsed = now.getTime() - lockTime.getTime(); // how much time has passed since lock
            const delay = this.RECORD_UNLOCK_DURATION - elapsed; // time left until 10 minutes passed

            if (delay > 0) {
                // wait remaining time before unlocking
                const handle = setTimeout(async () => {
                    this.timeoutMap.delete(r.id);
                    await this.unlockAndReassignToAnotherVA(r.id);
                }, delay);

                this.timeoutMap.set(r.id, handle);
            } else {
                // already past 10 minutes, unlock immediately
                this.unlockAndReassignToAnotherVA(r.id);
            }
        });

        // same for session expiration case but i used jwt instead of cookie based session
        // this needs to be handled VIA frontend by tracking the inactivity duration and then trigger
        // http call for record unlock - which is technically an auto-unlock and reassign feature
    }

    async unlockAndReassignToAnotherVA(recordId: string) {
        await this.recordService.autoUnlock(recordId);
        const availableVa = await this.userSerice.getLeastAssignedVa();
        if (!availableVa) {
            this.logger.warn(
                `No available VA found to reassign record ${recordId}`
            );
            return;
        }
        await this.recordService.assignRecord(recordId, availableVa.username);
    }
}
