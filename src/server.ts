import { IncomingMessage, ServerResponse } from 'http';
import * as http from 'http';


const hostname: string = '127.0.0.1';
const port: number = 3000;


// In-memory task store (just for demonstration purposes)
let tasks: Task[] = [];
let taskIdCounter = 1; // Auto-increment task ID


// Define a Task interface
interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}


// Helper function to check if the request is for a single task
const isTaskUrl = (url: string | undefined) => {
  if (!url) return false;
  const parts = url.split('/');
  return parts.length === 3 && parts[1] === 'tasks' && !isNaN(Number(parts[2]));
};


// Helper function to get the task ID from the URL
const getTaskIdFromUrl = (url: string | undefined): number | null => {
  if (!url) return null;
  const parts = url.split('/');
  const id = Number(parts[2]);
  return isNaN(id) ? null : id;
};


// Helper function to get the request body as a string (handles the 'data' and 'end' events)
const getRequestBody = function (req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
};


// Helper function to send a response in the specified format
const sendResponse = (res: ServerResponse, statusCode: number, success: boolean, payload: any, msg: string, errors: string[] = []) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success, payload, msg, errors }));
};


const server = http.createServer(async function (req: IncomingMessage, res: ServerResponse) {
  const { method, url } = req;


  // Handle different API endpoints
  if (url?.startsWith('/tasks')) {
    // GET all tasks
    if (method === 'GET' && url === '/tasks') {
      sendResponse(res, 200, true, tasks, 'Tasks retrieved successfully');
    }
    // GET a single task by ID
    else if (method === 'GET' && isTaskUrl(url)) {
      const taskId = getTaskIdFromUrl(url);
      if (taskId === null) {
        sendResponse(res, 400, false, null, 'Invalid Task ID', ['Task ID is invalid']);
      } else {
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
          sendResponse(res, 200, true, task, 'Task retrieved successfully');
        } else {
          sendResponse(res, 404, false, null, 'Task not found', ['No task found with the given ID']);
        }
      }
    }
    // POST to create a new task
    else if (method === 'POST' && url === '/tasks') {
      try {
        const body = await getRequestBody(req);
        const { title, description, completed } = JSON.parse(body);


        // Validation
        const errors: string[] = [];
        if (!title || typeof title !== 'string') errors.push('Title is required and must be a string');
        if (!description || typeof description !== 'string') errors.push('Description is required and must be a string');
        if (typeof completed !== 'boolean') errors.push('Completed must be a boolean');


        if (errors.length > 0) {
          sendResponse(res, 400, false, null, 'Validation errors', errors);
          return;
        }


        const newTask: Task = {
          id: taskIdCounter++,
          title,
          description,
          completed: completed ?? false,
        };
        tasks.push(newTask);
        sendResponse(res, 201, true, newTask, 'Task created successfully');
      } catch (error) {
        sendResponse(res, 400, false, null, 'Invalid request body', ['Failed to parse JSON']);
      }
    }
    // PUT to update an existing task by ID
    else if (method === 'PUT' && isTaskUrl(url)) {
      const taskId = getTaskIdFromUrl(url);
      if (taskId === null) {
        sendResponse(res, 400, false, null, 'Invalid Task ID', ['Task ID is invalid']);
      } else {
        try {
          const body = await getRequestBody(req);
          const { title, description, completed } = JSON.parse(body);


          // Validation
          const errors: string[] = [];
          if (title && typeof title !== 'string') errors.push('Title must be a string');
          if (description && typeof description !== 'string') errors.push('Description must be a string');
          if (completed !== undefined && typeof completed !== 'boolean') errors.push('Completed must be a boolean');


          if (errors.length > 0) {
            sendResponse(res, 400, false, null, 'Validation errors', errors);
            return;
          }


          const taskIndex = tasks.findIndex((t) => t.id === taskId);
          if (taskIndex !== -1) {
            tasks[taskIndex] = {
              id: taskId,
              title: title || tasks[taskIndex].title,
              description: description || tasks[taskIndex].description,
              completed: completed ?? tasks[taskIndex].completed,
            };
            sendResponse(res, 200, true, tasks[taskIndex], 'Task updated successfully');
          } else {
            sendResponse(res, 404, false, null, 'Task not found', ['No task found with the given ID']);
          }
        } catch (error) {
          sendResponse(res, 400, false, null, 'Invalid request body', ['Failed to parse JSON']);
        }
      }
    }
    // DELETE a task by ID
    else if (method === 'DELETE' && isTaskUrl(url)) {
      const taskId = getTaskIdFromUrl(url);
      if (taskId === null) {
        sendResponse(res, 400, false, null, 'Invalid Task ID', ['Task ID is invalid']);
      } else {
        const taskIndex = tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
          tasks.splice(taskIndex, 1);
          sendResponse(res, 200, true, null, 'Task deleted successfully');
        } else {
          sendResponse(res, 404, false, null, 'Task not found', ['No task found with the given ID']);
        }
      }
    }
    // If no matching route
    else {
      sendResponse(res, 404, false, null, 'Endpoint not found', ['The requested endpoint does not exist']);
    }
  } else {
    sendResponse(res, 404, false, null, 'Not Found', ['The requested resource was not found']);
  }
});


server.listen(port, hostname, function () {
  console.log(`Server running at http://${hostname}:${port}/`);
});


export default server;