//? Libraries
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CgMenuGridR } from 'react-icons/cg'
import { useEffect, useRef, useState } from 'react'

//? Routes
import routes from '../../routes'
import { BoardAdd } from '../workspace/board-add'
import blueLogo from '../../assets/img/header/trello-logo-blue.png'
import { logout } from '../../store/actions/user.actions'
import { showErrorMsg } from '../../services/connection/event-bus.service'

export function AppHeader({ type }) {
  const user = useSelector((storeState) => storeState.userModule.user)
  const board = useSelector((storeState) => storeState.boardModule.board)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const buttonRef = useRef()
  const userMenuRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isUserMenuOpen) return

    function closeUserMenu(ev) {
      if (!userMenuRef.current?.contains(ev.target)) {
        setIsUserMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', closeUserMenu)
    return () => window.removeEventListener('mousedown', closeUserMenu)
  }, [isUserMenuOpen])

  function onCloseModal() {
    setIsModalOpen(!isModalOpen)
  }

  async function onLogout() {
    try {
      await logout()
    } catch (err) {
      showErrorMsg('Unable to log out. Please try again.')
    } finally {
      navigate('/login', { replace: true })
    }
  }

  switch (type) {
    case 'main':
      return (<header
        className="app-header-section full"
        style={board?.style?.bgColor && { background: board.style.bgColor }}
      >
        <div className="menu">
        <Link to="/">
          <CgMenuGridR className="header-links" style={ board?.style?.isLight && {color: 'rgb(23, 43, 77)'}}/>
        </Link>
        <Link to="/board">
          <h2
            className="logo-name"
            style={ board?.style?.isLight ? {fontFamily: 'charlie-regular', color: 'rgb(23, 43, 77)'} :{ fontFamily: 'charlie-regular', color: 'white' }}
          >
            Fello
          </h2>
        </Link>
        <nav>
          {routes.map((route) => (
            <NavLink key={route.path} to={route.path} style={board?.style?.isLight? {color: 'rgb(23, 43, 77)'} : {color: 'white'}}>
              {route.label}
            </NavLink>
          ))}
        </nav>

        <div className='create-dropdown'>
          <button ref={buttonRef} onClick={() => { setIsModalOpen(!isModalOpen) }}>Create</button>
          {isModalOpen && <BoardAdd onCloseModal={onCloseModal} buttonRef={buttonRef} />}
        </div>
        </div>
        <div className="user-section">
          {user && (
            <div className="user-menu-container" ref={userMenuRef}>
              <button
                className="user-menu-button"
                type="button"
                aria-label="Open account menu"
                aria-expanded={isUserMenuOpen}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <img src={user.imgUrl} alt="" />
              </button>
              {isUserMenuOpen && (
                <div className="user-menu" role="menu">
                  <span className="user-menu-name">{user.fullname}</span>
                  <button type="button" role="menuitem" onClick={onLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>)
    case 'home':
      return (<header
        className="app-header-home-section full"
        style={{ background: "white" }}
      >
        <div className="logo-section">
          <img src={blueLogo} alt="logo" />
          <h2
            className="logo-name"
            style={{ fontFamily: 'charlie-regular', margin: 0 }}
          >
            Fello
          </h2>
        </div>
        <Link to="/login">Login</Link>
      </header>)
    default:
      return (console.log(`Cannot load component type: ${type}.`))
  }
}