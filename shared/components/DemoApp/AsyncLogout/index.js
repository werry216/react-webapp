import { createAsyncComponent } from 'react-async-component';

export default createAsyncComponent({
  resolve: () => System.import('./Logout'),
  ssrMode: 'boundary',
  name: 'AsyncLogout',
});
