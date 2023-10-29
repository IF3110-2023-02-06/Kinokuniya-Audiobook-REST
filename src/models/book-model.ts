import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "./user-model";

@Entity()
export class Book extends BaseEntity {
    @PrimaryGeneratedColumn()
    bookID: number;

    @Column()
    title: string;

    @Column()
    authorID: number;

    @Column()
    audioPath: string;

    @Column()
    duration: number;

    @ManyToOne(() => User, (user) => user.userID, { cascade: true })
    @JoinColumn({ name: "authorID" })
    user: User;
}