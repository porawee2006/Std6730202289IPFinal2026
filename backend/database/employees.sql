-- Database schema for HR Manager & Salary Analytics System
-- Final Exam: Internet Programming (2026)
-- Target Database: ip_std6730202289

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Table structure for table `employees`
--

CREATE TABLE IF NOT EXISTS `employees` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Active','On Leave') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `salary` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping initial mock data for table `employees`
--

INSERT INTO `employees` (`id`, `name`, `position`, `status`, `salary`) VALUES
('1', 'John Doe', 'Software Engineer', 'Active', 45000.00),
('2', 'Jane Smith', 'HR Manager', 'Active', 65000.00),
('3', 'Somchai Jaidee', 'Marketing Specialist', 'On Leave', 32000.00),
('4', 'Alice Johnson', 'Senior DevOps Engineer', 'Active', 85000.00),
('5', 'Bob Lee', 'Junior Frontend Developer', 'Active', 28000.00),
('6', 'Siriporn Wang', 'Data Analyst', 'Active', 42000.00)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

COMMIT;
