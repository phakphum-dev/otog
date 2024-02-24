export function scodeFileFilter(file: Express.Multer.File) {
  if (!file.originalname.match(/\.(c|cpp|cc|py)$/)) {
    return false;
  }
  return true;
}

export function scodeFileSizeLimit(
  file: Express.Multer.File,
  limitSize: number,
) {
  if (file.size > limitSize) {
    return false;
  }
  return true;
}

export const strToObj = (data: string) => {
  return data == null ? [] : JSON.parse(data);
};

export function lowerBound(arr: any[], target: any, key = (a: any) => a) {
  let l = 0;
  let r: number = arr.length;
  while (l < r) {
    const T = l + Math.floor((r - l) / 2);
    if (key(arr[T]) < target) {
      l = T + 1;
    } else r = T;
  }
  if (l === arr.length) return -1;
  return key(arr[l]) === target ? l : -1;
}

export function upperBound(arr: any[], target: any, key = (a: any) => a) {
  let l = 0;
  let r: number = arr.length;
  while (l < r) {
    const T = l + Math.floor((r - l) / 2);
    if (key(arr[T]) <= target) {
      l = T + 1;
    } else r = T;
  }
  return r;
}

export const userList = new Map();
