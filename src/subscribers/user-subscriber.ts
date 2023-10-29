import {
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent,
    UpdateEvent,
} from "typeorm";
import bcrypt from "bcrypt";

import { bcryptConfig } from "../config/bcrypt-config";
import { User } from "../models/user-model";

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
    listenTo() {
        return User;
    }

    async beforeInsert(event: InsertEvent<User>) {
        event.entity.password = await bcrypt.hash(
            event.entity.password,
            bcryptConfig.saltRounds
        );
    }

    async beforeUpdate(event: UpdateEvent<User>) {
        if (
            event.entity &&
            event.entity.password !== event.databaseEntity.password
        ) {
            event.entity.password = await bcrypt.hash(
                event.entity.password,
                bcryptConfig.saltRounds
            );
        }
    }
}