declare module 'primus-only-rtc-quickconnect';
declare module 'qrcode';
declare module 'freeice'

interface Date {
    now: () => [number];
}

declare module "worker-loader!*" {
    class WebpackWorker extends Worker {
      constructor();
    }
    export default WebpackWorker;
}
