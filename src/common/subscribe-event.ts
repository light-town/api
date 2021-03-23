import {
  MESSAGE_MAPPING_METADATA,
  MESSAGE_METADATA,
} from '@nestjs/websockets/constants';

export const SubscribeEvent = (namespace: string, event: string) => {
  return (target, key, descriptor) => {
    Reflect.defineMetadata(MESSAGE_MAPPING_METADATA, true, descriptor.value);
    Reflect.defineMetadata(
      MESSAGE_METADATA,
      { namespace, event },
      descriptor.value
    );
    return descriptor;
  };
};

export default SubscribeEvent;
