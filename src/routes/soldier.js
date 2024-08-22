import {
  deleteSoldierOpts,
  getSoldierOpts,
  getSoldiersByQueryOpts,
  postSoliderOpts,
  updateLimitationsOpts,
  updateSoliderOpts,
} from '../models/Soldier.js';
import { authenticate } from './authentication.js';

const soldierRoutes = async (fastify, options) => {
  fastify.addHook('preValidation', authenticate);
  await fastify.post('/', postSoliderOpts);
  await fastify.get('/:id', getSoldierOpts);
  await fastify.get('/', getSoldiersByQueryOpts);
  await fastify.delete('/:id', deleteSoldierOpts);
  await fastify.patch('/:id', updateSoliderOpts);
  await fastify.put('/:id/limitations', updateLimitationsOpts);
};

export default soldierRoutes;
