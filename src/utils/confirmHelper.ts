type ConfirmRequest = {
  message: string;
  resolve: (value: boolean) => void;
  randomCode: string;
};

let activeRequest: ConfirmRequest | null = null;
let onChangeListener: ((req: ConfirmRequest | null) => void) | null = null;

export const setConfirmListener = (listener: (req: ConfirmRequest | null) => void) => {
  onChangeListener = listener;
  if (onChangeListener) onChangeListener(activeRequest);
};

export const confirmWithRandomCode = (message: string): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    activeRequest = {
      message,
      resolve: (val) => {
        resolve(val);
        activeRequest = null;
        if (onChangeListener) onChangeListener(null);
      },
      randomCode
    };
    if (onChangeListener) onChangeListener(activeRequest);
  });
};
