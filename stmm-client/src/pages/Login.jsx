import { useState } from "react";
import axios from "axios";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("https://localhost:5056/api/Auth/login", {
        email,
        password,
      });

      console.log(res.data);
      alert("Login successful");

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (error) {
      console.log(error);
      alert("Invalid email or password");
    }
  };

  return (
    <div className="login-page">
      <header className="login-header"></header>

      <main className="login-main">
        <h1 className="system-title">
          Market Hall Management
          <br />
          System
        </h1>

        <div className="login-card">
          <h2>Welcome back</h2>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>EMAIL</label>
              <div className="input-box">
                <span className="input-icon">@</span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>PASSWORD</label>
              <div className="input-box">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-button"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember">
                <input type="checkbox" />
                <span>Remember Password</span>
              </label>

              <a href="#">Forgot Password</a>
            </div>

            <button type="submit" className="login-button">
              LOGIN <span>→</span>
            </button>

            <div className="line"></div>
          </form>
        </div>

        <div className="login-note">
          <span>♡ Enterprise-grade Security</span>
          <span>◎ Multi-language Support</span>
        </div>
      </main>

      <footer className="login-footer"></footer>
    </div>
  );
}

export default Login;
