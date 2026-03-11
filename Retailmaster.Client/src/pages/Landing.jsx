import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeUp, scaleIn, listItem } from '../motion'
import ThemeToggle from '../components/ThemeToggle'

export default function Landing() {
  const features = [
    {
      icon: 'bi-shop',
      title: 'Online Ordering',
      description: 'Browse menus and place orders from your favorite branches',
      color: 'text-primary',
      bg: 'bg-primary/10',
      link: '/online',
      button: 'Order Now',
      buttonColor: 'btn-primary'
    },
    {
      icon: 'bi-box-seam',
      title: 'Inventory Management',
      description: 'Real-time stock tracking across all branches',
      color: 'text-secondary',
      bg: 'bg-secondary/10'
    },
    {
      icon: 'bi-graph-up',
      title: 'Sales Reports',
      description: 'Comprehensive analytics and business insights',
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      icon: 'bi-building',
      title: 'Multi-branch',
      description: 'Manage multiple locations from one dashboard',
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    {
      icon: 'bi-people',
      title: 'Team Management',
      description: 'Role-based access for admins and cashiers',
      color: 'text-info',
      bg: 'bg-info/10'
    },
    {
      icon: 'bi-receipt',
      title: 'Professional Invoices',
      description: 'Generate and print invoices instantly',
      color: 'text-accent',
      bg: 'bg-accent/10'
    }
  ]

  const stats = [
    { value: '500+', label: 'Businesses' },
    { value: '50k+', label: 'Daily Transactions' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' }
  ]

  return (
    <div className="min-h-screen bg-base-200">
      
      {/* Navbar */}
      <nav className="bg-base-100/80 backdrop-blur-sm sticky top-0 z-50 border-b border-base-300">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 no-underline">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center font-black text-white">
                P
              </div>
              <span className="font-bold text-lg text-base-content">POSPro</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <a href="#features" className="btn btn-ghost btn-sm">Features</a>
              <a href="#pricing" className="btn btn-ghost btn-sm">Pricing</a>
              <a href="#about" className="btn btn-ghost btn-sm">About</a>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                Sign In
              </Link>
              <Link to="/online" className="btn btn-primary btn-sm gap-2">
                <i className="bi bi-bag" />
                <span className="hidden sm:inline">Order Online</span>
                <span className="sm:hidden">Order</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Left content */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm text-primary mb-6">
                <i className="bi bi-star-fill text-xs" />
                <span>Trusted by 500+ businesses</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-base-content leading-tight mb-4">
                Modern POS System for{' '}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Growing Businesses
                </span>
              </h1>
              
              <p className="text-base-content/60 text-lg mb-8 max-w-lg">
                Complete point of sale solution with inventory management, 
                sales reports, and online ordering for your customers.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link to="/online" className="btn btn-primary btn-lg gap-3 px-8">
                  <i className="bi bi-bag-check text-xl" />
                  Order Online
                </Link>
                <Link to="/create-company" className="btn btn-outline btn-lg gap-3 px-8">
                  <i className="bi bi-building-add" />
                  Start Business
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mt-12">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={i + 2}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-xs text-base-content/50">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right - Dashboard Preview */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              <div className="bg-base-100 rounded-2xl shadow-2xl border border-base-300 overflow-hidden">
                {/* Mock dashboard header */}
                <div className="bg-neutral px-6 py-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-error rounded-full" />
                  <div className="w-3 h-3 bg-warning rounded-full" />
                  <div className="w-3 h-3 bg-success rounded-full" />
                  <div className="ml-4 text-white/60 text-sm">Dashboard Preview</div>
                </div>
                
                {/* Mock dashboard content */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-primary/10 rounded-xl p-4">
                      <div className="text-primary text-sm mb-1">Today's Sales</div>
                      <div className="text-2xl font-bold text-primary">৳12,450</div>
                    </div>
                    <div className="bg-success/10 rounded-xl p-4">
                      <div className="text-success text-sm mb-1">Orders</div>
                      <div className="text-2xl font-bold text-success">48</div>
                    </div>
                  </div>
                  <div className="bg-base-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg" />
                      <div className="flex-1">
                        <div className="h-3 bg-base-300 rounded w-3/4 mb-2" />
                        <div className="h-2 bg-base-300 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-base-300 rounded w-full" />
                      <div className="h-2 bg-base-300 rounded w-5/6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                <i className="bi bi-star-fill text-yellow-300 mr-1" /> New
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-base-100">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={fadeUp} 
            initial="hidden" 
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-4">
              Everything you need to run your business
            </h2>
            <p className="text-base-content/60">
              Powerful features that streamline your operations and help you grow.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={listItem}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="card bg-base-200/50 border border-base-300 hover:border-primary/30 transition-all hover:-translate-y-1"
              >
                <div className="card-body">
                  <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <i className={`bi ${feature.icon} text-xl ${feature.color}`} />
                  </div>
                  <h3 className="font-bold text-base-content text-lg mb-2">{feature.title}</h3>
                  <p className="text-base-content/60 text-sm">{feature.description}</p>
                  
                  {feature.link && (
                    <Link to={feature.link} className={`mt-4 btn btn-sm ${feature.buttonColor} gap-2 w-full`}>
                      {feature.button} <i className="bi bi-arrow-right" />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Online Ordering Spotlight */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm text-primary mb-6">
                <i className="bi bi-megaphone-fill" />
                <span>Just Launched</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-4">
                Order Online from Your Favorite Branches
              </h2>
              
              <p className="text-base-content/60 text-lg mb-6">
                Customers can now browse products, check real-time availability, 
                and place orders directly through our online platform.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  'Real-time stock updates',
                  'Multiple branch selection',
                  'Easy checkout process',
                  'Order tracking',
                  'No account required'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <i className="bi bi-check-circle-fill text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link to="/online" className="btn btn-primary btn-lg gap-3 px-8">
                <i className="bi bi-bag-check text-xl" />
                Start Ordering Now
              </Link>
            </motion.div>

            <motion.div
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative"
            >
              {/* Mock mobile ordering interface */}
              <div className="bg-base-100 rounded-3xl shadow-2xl border border-base-300 overflow-hidden max-w-sm mx-auto">
                <div className="bg-neutral px-4 py-3 flex items-center gap-2">
                  <i className="bi bi-chevron-left text-white/60" />
                  <div className="flex-1 text-center text-white text-sm font-medium">Branch Menu</div>
                  <i className="bi bi-cart3 text-white/60" />
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-base-200 rounded-xl">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg" />
                        <div className="flex-1">
                          <div className="font-medium">Product Name {i}</div>
                          <div className="text-primary font-bold">৳{i}99</div>
                        </div>
                        <button className="btn btn-primary btn-sm btn-circle">
                          <i className="bi bi-plus" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating notification */}
              <div className="absolute -bottom-4 -left-4 bg-success text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-bounce">
                <i className="bi bi-cart-check-fill mr-1" /> Order placed!
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
<section className="py-20">
  <div className="container mx-auto px-4">
    <motion.div
      variants={scaleIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="card bg-gradient-to-r from-primary to-secondary text-white overflow-hidden relative"
    >
      {/* Fixed SVG background - using template literals */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
             backgroundRepeat: 'repeat'
           }} 
      />

      <div className="card-body text-center relative z-10 py-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to transform your business?
        </h2>
        <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
          Join hundreds of businesses already using POSPro to streamline their operations.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/create-company" className="btn btn-lg bg-white text-primary hover:bg-gray-100 gap-3 px-8 border-0">
            <i className="bi bi-rocket-fill" />
            Start Free Trial
          </Link>
          <Link to="/online" className="btn btn-lg btn-outline text-white border-white hover:bg-white/10 gap-3 px-8">
            <i className="bi bi-bag-check" />
            Order Online
          </Link>
        </div>
        <p className="text-white/60 text-sm mt-6">
          No credit card required · Free 14-day trial
        </p>
      </div>
    </motion.div>
  </div>
</section>

      {/* Footer */}
      <footer className="bg-base-300/50 border-t border-base-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center font-black text-white text-xs">
                  P
                </div>
                <span className="font-bold text-base-content">POSPro</span>
              </div>
              <p className="text-sm text-base-content/50">
                Modern POS system for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-base-content/50">
                <li><a href="#features" className="hover:text-primary">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary">Pricing</a></li>
                <li><Link to="/online" className="hover:text-primary">Online Ordering</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-base-content/50">
                <li><a href="#about" className="hover:text-primary">About</a></li>
                <li><a href="#contact" className="hover:text-primary">Contact</a></li>
                <li><a href="#careers" className="hover:text-primary">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-base-content/50">
                <li><a href="#privacy" className="hover:text-primary">Privacy</a></li>
                <li><a href="#terms" className="hover:text-primary">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-base-300 mt-8 pt-8 text-center text-sm text-base-content/40">
            © {new Date().getFullYear()} POSPro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}