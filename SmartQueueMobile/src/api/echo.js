import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';
import NetInfo from '@react-native-community/netinfo'; // 👈 Add this line

// Required for Pusher to work in React Native environment
window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'pusher',
    key: '5d48ced773847463d73e', // Your Key
    cluster: 'ap1',
    forceTLS: true,
});

echo.connector.pusher.connection.bind('connected', () => {
    console.log('✅ Phone is connected to Pusher!');
});

export default echo;