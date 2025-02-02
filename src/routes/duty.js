import {
  cancelDutyOpts,
  deleteDutyOpts,
  getDutiesByQueryOpts,
  getDutyOpts,
  postDutyOpts,
  scheduledDutyOpts,
  updateConstraintsOpts,
  updateDutyOpts,
} from '../models/Duty.js';
import { authenticate } from './authentication.js';

const dutyRoutes = async (fastify, options) => {
  fastify.addHook('preValidation', authenticate);
  await fastify.post('/', postDutyOpts);
  await fastify.get('/', getDutiesByQueryOpts);
  await fastify.get('/:id', getDutyOpts);
  await fastify.delete('/:id', deleteDutyOpts);
  await fastify.put('/:id', updateDutyOpts);
  await fastify.patch('/:id/cancel', cancelDutyOpts);
};

export default dutyRoutes;
