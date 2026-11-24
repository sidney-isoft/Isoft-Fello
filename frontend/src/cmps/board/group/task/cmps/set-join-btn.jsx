//? Icons
import { HiOutlineUser } from 'react-icons/hi'

export function SetJoinBtn({ onUpdateTask, task }) {
  function onJoinTask() {
    if (task?.priority !== 'high') onUpdateTask('priority', 'high')
  }
  return (
    <button onClick={onJoinTask} title="Add members">
      <HiOutlineUser /> Join
    </button>
  )
}
