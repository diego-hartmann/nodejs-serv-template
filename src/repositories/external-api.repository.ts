import axios from 'axios';

export const externalApiRepository = {
  async fetch() {
    return (await axios.get('https://example.com')).data;
  }
};
