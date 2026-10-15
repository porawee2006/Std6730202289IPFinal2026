-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 03, 2026 at 04:46 AM
-- Server version: 8.0.46-0ubuntu0.24.04.4
-- PHP Version: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ip_std6730202289`
--

-- --------------------------------------------------------

--
-- Table structure for table `powerbanks`
--

CREATE TABLE `powerbanks` (
  `id` int NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `stock` int DEFAULT '0',
  `max_output` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ports` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Active',
  `productCode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastUpdate` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `powerbanks`
--

INSERT INTO `powerbanks` (`id`, `name`, `brand`, `capacity`, `price`, `stock`, `max_output`, `ports`, `image`, `status`, `productCode`, `lastUpdate`) VALUES
(1, 'Anker PowerBank', '', 0, 4900.00, 15, NULL, NULL, 'https://th.bing.com/th/id/OIP.zvgd241j_T__c5sr7W5S2gHaJQ?r=0&o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3', 'Active', NULL, '2026-09-03 09:38:56');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','user') COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`, `created_at`) VALUES
(1, 'Admin', '$2b$10$/l64wUYIoTxNKEFGswHtyO1OQugASrS.pxRIbGI7HFcZIo7xEFJ6W', 'admin', '2026-08-27 03:01:23'),
(4, 'new', '$2b$10$8jEk9tZWrttqyGEXnteNj.DZjUynoGO1RUZlY3dKuovBo6lTsGQgi', 'user', '2026-08-27 03:30:14'),
(5, 'ik', '$2b$10$hlaQidaoLUw8nBeAoVZJYuoFAvVLHf836klFld32EECG9aqJbWT3u', 'user', '2026-09-03 03:11:49');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `powerbanks`
--
ALTER TABLE `powerbanks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `powerbanks`
--
ALTER TABLE `powerbanks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

-- --------------------------------------------------------

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
-- Dumping data for table `employees`
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

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
