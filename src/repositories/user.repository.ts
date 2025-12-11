export const userRepository = {
  async create(data: any) {
    return { id: '123', ...data };
  },
  async list() {
    return [];
  },
  async findById(id: string) {
    return { id, name: 'Example' };
  }
};
