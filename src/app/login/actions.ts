'use server'

import { prisma } from "@/lib/prisma"
import { signJWT } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData) {
  const username = (formData.get('username') as string)?.trim()
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: "Por favor rellena todos los campos." }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return { error: "Usuario o contraseña incorrectos." }
    }

    const isMatch = bcrypt.compareSync(password, user.password)
    if (!isMatch) {
      return { error: "Usuario o contraseña incorrectos." }
    }

    const token = await signJWT({
      userId: user.id,
      username: user.username,
      role: user.role,
      nombre: user.nombre
    })

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/'
    })

    return { success: true }
  } catch (error: any) {
    return { error: "Ocurrió un error al iniciar sesión." }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('session')
  redirect('/login')
}
