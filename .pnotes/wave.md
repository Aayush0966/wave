Implemented the WS
Now We need the change DS of messages on the zustand state. 
Maybe make it good to work it
and for seen messages. On the messageList, run the number of unseen messages ids and send it to the backend to mark them as seen.

and useEffect with foucus window to mark remaining messages

I think we can do it with a useEffect on the messageList component, and when the user focuses the window, we can send the unseen messages to the backend to mark them as seen yeah this way we dont need to mark all messages as seen on the backend, we can just mark the unseen messages as seen when the user focuses the window.
