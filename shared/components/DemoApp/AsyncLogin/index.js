import { createAsyncComponent } from 'react-async-component';

export default createAsyncComponent({
  resolve: () => System.import('./Login'),
  ssrMode: 'boundary',
  name: 'AsyncLogin',
});
