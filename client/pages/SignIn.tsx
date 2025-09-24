import { Link } from "react-router-dom";
import { useState } from "react";

export default function SignIn() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen bg-ufc-black relative">
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url('/octagon-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.25,
        }}
      />

      {/* Subtle dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative container mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto bg-ufc-black/80 border border-ufc-metallic-dark rounded-lg shadow-xl">
          <div className="p-6 border-b border-ufc-metallic-dark text-center">
            <h1 className="font-anton text-4xl text-white tracking-wider">ACCOUNT ACCESS</h1>
            <p className="mt-2 text-ufc-metallic font-oswald">Sign in to your account or create a new one</p>
          </div>

          <div className="p-6">
            {/* Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode("signin")}
                className={`py-3 font-oswald font-bold tracking-wider border ${
                  mode === "signin"
                    ? "bg-ufc-red text-white border-ufc-red"
                    : "text-ufc-metallic border-ufc-metallic-dark hover:text-white hover:border-white"
                }`}
              >
                SIGN IN
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`py-3 font-oswald font-bold tracking-wider border ${
                  mode === "signup"
                    ? "bg-ufc-red text-white border-ufc-red"
                    : "text-ufc-metallic border-ufc-metallic-dark hover:text-white hover:border-white"
                }`}
              >
                SIGN UP
              </button>
            </div>

            {/* Form */}
            <form className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-oswald text-ufc-metallic mb-1">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-transparent border border-ufc-metallic-dark focus:border-white outline-none px-4 py-3 text-white placeholder:text-ufc-metallic"
                />
              </div>
              <div>
                <label className="block text-sm font-oswald text-ufc-metallic mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Your password"
                  className="w-full bg-transparent border border-ufc-metallic-dark focus:border-white outline-none px-4 py-3 text-white placeholder:text-ufc-metallic"
                />
              </div>

              <div className="text-right">
                <button type="button" className="text-sm text-ufc-metallic hover:text-white font-oswald">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-ufc-red hover:bg-ufc-red-dark text-white py-3 font-oswald font-bold tracking-wider transition-all duration-300 border border-ufc-red hover:border-white"
              >
                {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
              </button>
            </form>

            <div className="mt-6 text-center text-ufc-metallic font-oswald">
              {mode === "signin" ? (
                <>
                  New here?{" "}
                  <button onClick={() => setMode("signup")} className="text-white hover:underline">
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button onClick={() => setMode("signin")} className="text-white hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </div>

            <p className="mt-6 text-center text-xs text-ufc-metallic">
              By continuing, you agree to our
              {" "}
              <Link to="#" className="hover:underline text-white">Terms of Service</Link>
              {" "}and{" "}
              <Link to="#" className="hover:underline text-white">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


