import { Generated, ColumnType, RawBuilder } from 'kysely';

export type Json = ColumnType<JsonValue, string, string>;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [K in string]?: JsonValue;
};

export type JsonPrimitive = boolean | null | number | string;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Timestamp = ColumnType<Date | RawBuilder, Date | string | RawBuilder, Date | string | RawBuilder>;


export interface Users {
  id: Generated<number>;
  email: string;
  name: string;
  password: string;
  createdAt: Generated<number>;
  username: string;
  updatedAt: Generated<string>;
  followersCount: Generated<number>;
}

export interface Comments {
  id: Generated<number>;
  message: string;
  createdAt: Generated<number>;
  updatedAt: Generated<string>;
  userId: number;
  count: Generated<number>;
}

export interface Quizzes {
  id: number;
  updatedAt: Generated<string>;
  createdAt: Generated<number>;
  reactionStatistics: Json | null;
  done: Generated<number>;
}

export default interface DB {
  users: Users;
  users2: {
    id: number;
    bla: string;
    test2: number;
  };
  comments: Comments;
  quizzes: Quizzes;
};