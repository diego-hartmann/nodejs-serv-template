import { userRepository } from '../repositories/user.repository';

export const userService = {
  create: (data: any) => userRepository.create(data),
  list: () => userRepository.list(),
  findById: (id: string) => userRepository.findById(id)
};
