import request from 'supertest';
import { IncomingMessage, ServerResponse } from 'http';
import * as http from 'http';
import server from '../src/server'; // Replace with the actual server import

describe('Task API', () => {
    let app: http.Server<typeof IncomingMessage, typeof ServerResponse>;

    beforeAll(() => {
        app = server.listen();
    });

    afterAll(() => {
        app.close();
    });

    // Test for POST /tasks to create a new task
    it('should create a new task', async () => {
        const newTask = { title: 'Test Task', description: 'Task for testing', completed: false };
        const response = await request(app).post('/tasks').send(newTask);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject(newTask);
        expect(response.body).toHaveProperty('id');
    });

    // Test for GET /tasks to retrieve all tasks
    it('should retrieve all tasks', async () => {
        const response = await request(app).get('/tasks');

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });

    // Test for GET /tasks/:id to retrieve a specific task
    it('should retrieve a task by ID', async () => {
        const newTask = { title: 'Task to Retrieve', description: 'Task retrieval test', completed: false };
        const createdTask = await request(app).post('/tasks').send(newTask);
        const response = await request(app).get(`/tasks/${createdTask.body.id}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject(newTask);
    });

    // Test for PUT /tasks/:id to update a specific task
    it('should update a task by ID', async () => {
        const newTask = { title: 'Update Test Task', description: 'Before Update', completed: false };
        const createdTask = await request(app).post('/tasks').send(newTask);

        const updatedTask = { title: 'Updated Task', description: 'After Update', completed: true };
        const response = await request(app).put(`/tasks/${createdTask.body.id}`).send(updatedTask);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject(updatedTask);
    });

    // Test for DELETE /tasks/:id to delete a specific task
    it('should delete a task by ID', async () => {
        const newTask = { title: 'Task to Delete', description: 'Task deletion test', completed: false };
        const createdTask = await request(app).post('/tasks').send(newTask);

        const deleteResponse = await request(app).delete(`/tasks/${createdTask.body.id}`);
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body).toEqual({ message: 'Task deleted' });

        const getResponse = await request(app).get(`/tasks/${createdTask.body.id}`);
        expect(getResponse.status).toBe(404);
    });
});