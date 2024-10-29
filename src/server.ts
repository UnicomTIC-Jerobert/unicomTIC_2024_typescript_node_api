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


const server = http.createServer(async function (req: IncomingMessage, res: ServerResponse) {
  const { method, url } = req;

  // Handle different API endpoints
  if (url?.startsWith('/tasks')) {
    // GET all tasks
    if (method === 'GET' && url === '/tasks') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(tasks));
    }
    // GET a single task by ID
    else if (method === 'GET' && isTaskUrl(url)) {
      const taskId = getTaskIdFromUrl(url);
      if (taskId === null) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: 'Invalid Task ID' }));
      } else {
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(task));
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ message: 'Task not found' }));
        }
      }
    }
    // POST to create a new task
    else if (method === 'POST' && url === '/tasks') {
      try {
        const body = await getRequestBody(req);

        const { title, description, completed } = JSON.parse(body);
        const newTask: Task = {
          id: taskIdCounter++,
          title,
          description,
          completed: completed ?? false,
        };
        tasks.push(newTask);


        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(newTask));
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: 'Invalid request body' }));
      }

    }
    // PUT to update an existing task by ID
    else if (method === 'PUT' && isTaskUrl(url)) {
      const taskId = getTaskIdFromUrl(url);
      if (taskId === null) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: 'Invalid Task ID' }));
      } else {
        try {
          const body = await getRequestBody(req);

          const { title, description, completed } = JSON.parse(body);
          const taskIndex = tasks.findIndex((t) => t.id === taskId);


          if (taskIndex !== -1) {
            tasks[taskIndex] = {
              id: taskId,
              title: title || tasks[taskIndex].title,
              description: description || tasks[taskIndex].description,
              completed: completed ?? tasks[taskIndex].completed,
            };


            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(tasks[taskIndex]));
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ message: 'Task not found' }));
          }

        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify({ message: 'Invalid request body' }));
        }

      }
    }
    // DELETE a task by ID
    else if (method === 'DELETE' && isTaskUrl(url)) {
      const taskId = getTaskIdFromUrl(url);
      if (taskId === null) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: 'Invalid Task ID' }));
      } else {
        const taskIndex = tasks.findIndex((t) => t.id === taskId);


        if (taskIndex !== -1) {
          tasks.splice(taskIndex, 1);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Task deleted' }));
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ message: 'Task not found' }));
        }
      }
    }
    // If no matching route
    else {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: 'Endpoint not found' }));
    }
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }

});

server.listen(port, hostname, function () {
  console.log(`Server running at http://${hostname}:${port}/`);
});



export default server;






