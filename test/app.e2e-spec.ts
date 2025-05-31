import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";

describe("AppController (e2e)", () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it("/auth/login (POST) should return 401 for bad login", () => {
        return request(app.getHttpServer())
            .post("/auth/login")
            .send({ username: "invalid", password: "wrong" })
            .expect(401);
    });

    afterAll(async () => {
        await app.close();
    });
});
