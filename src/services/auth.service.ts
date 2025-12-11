export const authService = {
  async login(data: any) {
    return { token: 'fake', user: { email: data.email } };
  },
  async register(data: any) {
    return { id: '123', ...data };
  }
};
