import { get, post } from './request';

export const GetSupportedTasks = () => {
  return get('/tasks');
};

export const ProcessTextTask = (task, text) => {
  return post('/process-task', {
    task,
    text
  });
};
