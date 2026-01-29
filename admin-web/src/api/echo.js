import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const echo = new Echo({
 broadcaster: "pusher",
key: "5d48ced773847463d73e", // Your Key
cluster: "ap1",
forceTLS: true,
});

export default echo;