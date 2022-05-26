import Lock from "./Lock"
// Beware: this is potentially dead-lock prone. 
export const Synchronized = () => (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
  const lock = new Lock();
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    await lock.acquire();
    try {
      return await originalMethod.apply(this, args);
    } finally {
      lock.release();
    }
  }
}
