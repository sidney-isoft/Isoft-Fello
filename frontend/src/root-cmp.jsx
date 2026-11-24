//? Libraries
import React from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
//? Components
import { AppHeader } from './cmps/app/app-header'
import { UserDetails } from './pages/user/user-details'
import { BoardIndex } from './pages/board/board-index'
import { TaskDetails } from './cmps/board/group/task/task-details'
import { Home } from './pages/home'

//? Routes
import routes from './routes'
import { LoginSignup } from './cmps/user/login-signup'
import { useSelector } from 'react-redux'

export function RootCmp() {
  const user = useSelector((storeState => storeState.userModule.user))

  const location = useLocation()
  const background = location.state && location.state.background
  const protectedElement = (element) =>
    user ? element : <Navigate to="/login" replace state={{ from: location }} />

  return (
    <div className="main-layout app">
      {user && <AppHeader type={'main'} />}
      <main>
        <Routes location={background || location}>
          <Route element={<Home />} path="/" />
          <Route element={protectedElement(<BoardIndex />)} path="/board/:boardId">
            <Route
              element={protectedElement(<TaskDetails />)}
              path="/board/:boardId/group/:groupId/task/:taskId"
            />
          </Route>
          <Route element={protectedElement(<UserDetails />)} path="/user" />
          <Route
            element={user ? <Navigate to="/board" replace /> : <LoginSignup />}
            path="/login"
          />
          {routes.map((route) => (
            <Route
              key={route.path}
              exact={true}
              element={protectedElement(route.component)}
              path={route.path}
            />
          ))}
        </Routes>
        {background && (
          <Routes>
            <Route
              path="/board/:boardId/group/:groupId/task/:taskId"
              element={protectedElement(<TaskDetails />)}
            />
          </Routes>
        )}
      </main>
    </div>
  )
}
