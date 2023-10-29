import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";

import { Book } from "./book-model";

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    userID: number;

    @Column({
        unique: true,
    })
    email: string;

    @Column({
        unique: true,
    })
    username: string;

    @Column()
    name: string;

    @Column()
    password: string;

    @Column({
        default: false,
    })

    @OneToMany(() => Book, (book) => book.user)
    books: Book[];
}