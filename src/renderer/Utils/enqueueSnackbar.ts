//
import { toast } from 'react-toastify';

// interface Params {
//     message: string | JSX.Element,
//     severity: 'success' | 'error'
// }

export default (message: string | JSX.Element, severity?: 'success' | 'info' | 'error') => {
    if(severity === undefined) {
        toast(message);
    }
    else
    {
        toast[severity](message);
    }
}
